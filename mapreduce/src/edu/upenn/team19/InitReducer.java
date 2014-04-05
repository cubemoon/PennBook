package edu.upenn.team19;
import java.io.IOException;
import java.util.HashMap;

import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.Reducer.Context;

public class InitReducer extends Reducer<Text, Text, Text, Text>{
	public void reduce(Text key, Iterable<Text> values, Context context) throws IOException, InterruptedException{
		double totalweight = 0.0;
		HashMap<String, Double> edgeweight = new HashMap<String, Double>();
		String edges = "";
		
		for (Text value :values) {
			String otheruser = value.toString().split(":")[0];
			double weight = Double.parseDouble(value.toString().split(":")[1]);
			totalweight += weight;
			
			System.out.println(otheruser + " : " + weight);
			
			edgeweight.put(otheruser, weight);
		}
		
		for (String edge : edgeweight.keySet()) {
			double weighted = edgeweight.get(edge) / totalweight;
			edges += weighted + "," + edge + ";";
			
			System.out.println(weighted + "," + edge + ";");
		}
		
		String initialrank = 1 + "," + key.toString() + ";";
		
		context.write(new Text(key.toString()), new Text(edges + " " + initialrank));
	}
}